from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
import json
from app.models import User
import traceback

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    """Base login view with common functionality"""
    def get(self, request):
        """Handle GET requests - for checking login status"""
        if request.user.is_authenticated:
            return JsonResponse({
                'status': 'success',
                'message': 'Already logged in',
                'user_id': request.user.id,
                'email': request.user.email,
                'name': request.user.name,
                'isHost': request.user.isHost
            })
        else:
            return JsonResponse({'status': 'error', 'message': 'Not authenticated'}, status=401)


@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(View):
    """Login endpoint specifically for regular users (volunteers)"""
    def post(self, request):
        try:
            # Get credentials from request
            data = request.POST if request.POST else json.loads(request.body)
            email = data.get('email', '')
            password = data.get('password', '')
            
            if not email or not password:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email and password are required'
                }, status=400)
            
            # Authenticate user
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                # Check if the user is a regular user (not a host)
                if user.isHost:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid user credentials. This account is registered as a host.'
                    }, status=401)
                
                login(request, user)
                
                # Return user info
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful',
                    'user_id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'isHost': False,
                    'skills': user.skills,
                    'age': user.age,
                    'location': user.location,
                    'organization': user.organization
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email or password'
                }, status=401)
                
        except Exception as e:
            print(f"Error in user login: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def get(self, request):
        """Handle GET requests"""
        # Check if there's a 'next' parameter in the query string
        next_url = request.GET.get('next', '/api/auth/profile/')
        
        # If user is already authenticated, return success
        if request.user.is_authenticated:
            if request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You are logged in as a host. Please use the host login endpoint.'
                }, status=403)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Already logged in',
                'user_id': request.user.id,
                'email': request.user.email,
                'name': request.user.name,
                'isHost': False
            })
        
        # For API usage - return a response explaining authentication is required
        return JsonResponse({
            'status': 'error',
            'message': 'Authentication required',
            'login_required': True,
            'next': next_url
        }, status=401)


@method_decorator(csrf_exempt, name='dispatch')
class HostLoginView(View):
    """Login endpoint specifically for hosts"""
    def post(self, request):
        try:
            # Get credentials from request
            data = request.POST if request.POST else json.loads(request.body)
            email = data.get('email', '')
            password = data.get('password', '')
            
            if not email or not password:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email and password are required'
                }, status=400)
            
            # Authenticate user
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                # Check if the user is a host
                if not user.isHost:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid host credentials. This account is registered as a regular user.'
                    }, status=401)
                
                login(request, user)
                
                # Return host info
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful',
                    'host_id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'isHost': True
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email or password'
                }, status=401)
                
        except Exception as e:
            print(f"Error in host login: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def get(self, request):
        """Handle GET requests"""
        # Check if there's a 'next' parameter in the query string
        next_url = request.GET.get('next', '/api/auth/profile/')
        
        # If user is already authenticated, return success
        if request.user.is_authenticated:
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'You are logged in as a regular user. Please use the user login endpoint.'
                }, status=403)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Already logged in',
                'host_id': request.user.id,
                'email': request.user.email,
                'name': request.user.name,
                'isHost': True
            })
        
        # For API usage - return a response explaining authentication is required
        return JsonResponse({
            'status': 'error',
            'message': 'Authentication required',
            'login_required': True,
            'next': next_url
        }, status=401)


@method_decorator(csrf_exempt, name='dispatch')
class UserSignupView(View):
    """Signup endpoint for regular users (volunteers)"""
    def post(self, request):
        try:
            # Get data from request
            data = request.POST if request.POST else json.loads(request.body)
            
            email = data.get('email', '')
            password = data.get('password', '')
            name = data.get('name', '')
            contact = data.get('contact', '')
            
            # Additional fields for regular users
            skills = data.get('skills', '')
            age = data.get('age')
            location = data.get('location', '')
            organization = data.get('organization', '')
            
            # Validate required fields
            if not email or not password or not name or not contact:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email, password, name, and contact are required'
                }, status=400)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email already registered'
                }, status=400)
            
            # Check if contact already exists
            if User.objects.filter(contact=contact).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Contact already registered'
                }, status=400)
            
            # Create user (as a regular user, not a host)
            user = User.objects.create_user(
                email=email,
                password=password,
                name=name,
                contact=contact,
                isHost=False,
                skills=skills,
                age=age,
                location=location,
                organization=organization
            )
            
            # Log the user in
            login(request, user)
            
            return JsonResponse({
                'status': 'success',
                'message': 'User created successfully',
                'user_id': user.id,
                'email': user.email,
                'name': user.name,
                'isHost': False
            })
            
        except Exception as e:
            print(f"Error in user signup: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def get(self, request):
        """Handle GET requests to signup page"""
        return JsonResponse({
            'status': 'info',
            'message': 'Please use POST method to sign up'
        })


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(View):
    """Logout the current user"""
    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
            return JsonResponse({
                'status': 'success',
                'message': 'Logged out successfully'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Not logged in'
            }, status=401)
    
    def get(self, request):
        """Handle GET requests - explain that POST is required"""
        return JsonResponse({
            'status': 'info',
            'message': 'Please use POST method to logout'
        })


@method_decorator(csrf_exempt, name='dispatch')
class ProfileView(View):
    """Get the current user's profile"""
    def get(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Authentication required'
            }, status=401)
        
        user = request.user
        
        profile_data = {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'contact': user.contact,
            'isHost': user.isHost,
            'date_joined': user.date_joined,
        }
        
        # Add regular user fields if not a host
        if not user.isHost:
            profile_data.update({
                'skills': user.skills,
                'age': user.age,
                'location': user.location,
                'organization': user.organization,
            })
        
        return JsonResponse({
            'status': 'success',
            'profile': profile_data
        })


@method_decorator(csrf_exempt, name='dispatch')
class IsAuthenticatedView(View):
    """
    Simple view to check if a user is authenticated
    Returns only a boolean indicating authentication status and minimal user info
    """
    def get(self, request):
        # Check authentication status
        is_authenticated = request.user.is_authenticated
        
        # Prepare response data
        response_data = {
            'status': 'success',
            'isAuthenticated': is_authenticated,
            'authenticated': is_authenticated,
        }
        
        # If authenticated, include minimal user info
        if is_authenticated:
            response_data['user'] = {
                'id': request.user.id,
                'name': request.user.name,
                'isHost': request.user.isHost
            }
        
        # Set appropriate status code (200 for both auth and non-auth)
        return JsonResponse(response_data)

    def post(self, request):
        """Handle POST requests by delegating to GET"""
        return self.get(request)

# For backwards compatibility - these functions call the class-based views
def user_login(request):
    """Compatibility function for user_login"""
    view = UserLoginView.as_view()
    return view(request)

def host_login(request):
    """Compatibility function for host_login"""
    view = HostLoginView.as_view()
    return view(request)

def user_signup(request):
    """Compatibility function for user_signup"""
    view = UserSignupView.as_view()
    return view(request)

def logout_view(request):
    """Compatibility function for logout_view"""
    view = LogoutView.as_view()
    return view(request)

def profile(request):
    """Compatibility function for profile"""
    view = ProfileView.as_view()
    return view(request)

def check_auth(request):
    """Compatibility function for is_authenticated - returns authentication status and user info"""
    view = IsAuthenticatedView.as_view()
    return view(request)
