from app.models import User
from app.models import Host
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import re
from django.contrib.auth.hashers import make_password, check_password

def validate_password(password):
    """
    Validate that the password meets requirements:
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def validate_name(name):
    """Validate that name is not empty and has reasonable length"""
    if not name:
        return False, "Name cannot be empty"
    
    if len(name) < 2:
        return False, "Name is too short"
    
    if len(name) > 255:
        return False, "Name is too long"
    
    return True, "Name is valid"

def validate_contact(contact):
    """Validate that contact number has proper format"""
    if not re.match(r'^\+?[0-9]{10,15}$', contact):
        return False, "Contact number must contain 10-15 digits"
    
    return True, "Contact is valid"

@csrf_exempt
def user_signup(request):
    if request.method == 'POST':
        try:
            # Use request.POST to handle x-www-form-urlencoded data
            name = request.POST.get('name', '')
            password = request.POST.get('password', '')
            email = request.POST.get('email', '')
            contact = request.POST.get('contact', '')
            # role = request.POST.get('role', '')
            skills = request.POST.get('skills', '')
            age = int(request.POST.get('age', 0))
            location = request.POST.get('location', '')
            organization = request.POST.get('organization', '')

            # Validate inputs
            name_valid, name_msg = validate_name(name)
            if not name_valid:
                return JsonResponse({'status': 'error', 'message': name_msg}, status=400)

            password_valid, password_msg = validate_password(password)
            if not password_valid:
                return JsonResponse({'status': 'error', 'message': password_msg}, status=400)

            contact_valid, contact_msg = validate_contact(contact)
            if not contact_valid:
                return JsonResponse({'status': 'error', 'message': contact_msg}, status=400)

            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({'status': 'error', 'message': 'Email already registered'}, status=400)

            # Check if contact already exists
            if User.objects.filter(contact=contact).exists():
                return JsonResponse({'status': 'error', 'message': 'Contact number already registered'}, status=400)

            # Create user with hashed password
            hashed_password = make_password(password)
            user = User.objects.create(
                name=name,
                password=hashed_password,
                email=email,
                contact=contact,
                # role=role,
                skills=skills,
                age=age,
                location=location,
                organization=organization
            )

            return JsonResponse({
                'status': 'success',
                'message': 'User registered successfully',
                'user_id': user.id
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        try:
            # Try both POST form data and JSON body
            email = request.POST.get('email', '')
            password = request.POST.get('password', '')
            
            # If POST data is empty, try to parse from JSON body
            if not email or not password:
                try:
                    data = json.loads(request.body)
                    email = data.get('email', '')
                    password = data.get('password', '')
                except json.JSONDecodeError:
                    pass
            
            print(f"Login attempt for user with email: {email}")
            
            try:
                user = User.objects.get(email=email)
                print(f"User found: {user.id}")
            except User.DoesNotExist:
                print("User not found")
                return JsonResponse({'status': 'error', 'message': 'Invalid email or password'}, status=401)
            
            # Add debug prints
            print(f"Input password: {password}")
            print(f"Stored hashed password: {user.password}")
            
            # Check if this is a plaintext password (for admin-created users)
            if user.password == password:
                print("Matched with direct comparison (for admin-created users)")
                # Rehash the password to secure it properly
                user.password = make_password(password)
                user.save()
            # Try the normal password check
            elif not check_password(password, user.password):
                print("Password check failed")
                return JsonResponse({'status': 'error', 'message': 'Invalid email or password'}, status=401)

            print("Login successful")
            return JsonResponse({
                'status': 'success',
                'message': 'Login successful',
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
            })
            
        except Exception as e:
            import traceback
            print(f"Exception in user_login: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
@csrf_exempt
def host_login(request):
    if request.method == 'POST':
        try:
            # Try both POST form data and JSON body
            email = request.POST.get('email', '')
            password = request.POST.get('password', '')
            
            # If POST data is empty, try to parse from JSON body
            if not email or not password:
                try:
                    data = json.loads(request.body)
                    email = data.get('email', '')
                    password = data.get('password', '')
                except json.JSONDecodeError:
                    pass
            
            print(f"Login attempt for host with email: {email}")
            
            try:
                host = Host.objects.get(email=email)
                print(f"Host found: {host.id}")
            except Host.DoesNotExist:
                print("Host not found")
                return JsonResponse({'status': 'error', 'message': 'Invalid email or password'}, status=401)
            
            # Add debug prints to see what's happening
            print(f"Input password: {password}")
            print(f"Stored hashed password: {host.password}")
            
            # Check if this is a Django admin created password (raw password stored for testing)
            if host.password == password:
                print("Matched with direct comparison (for admin-created hosts)")
                # Consider rehashing the password to secure it properly
                host.password = make_password(password)
                host.save()
            # Try the normal password check
            elif not check_password(password, host.password):
                print("Password check failed")
                return JsonResponse({'status': 'error', 'message': 'Invalid email or password'}, status=401)
            
            print("Login successful")
            return JsonResponse({
                'status': 'success',
                'message': 'Login successful',
                'host_id': host.id,
                'name': host.name,
                'email': host.email
            })
            
        except Exception as e:
            import traceback
            print(f"Exception in host_login: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)