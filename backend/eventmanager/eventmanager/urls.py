from django.contrib import admin
from django.urls import path, include
from eventmanager.auth import user_signup , user_login, host_login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/user/signup/', user_signup, name='user_signup'),
    path('api/auth/user/login/', user_login, name='user_login'),
    path('api/auth/host/login/', host_login, name='host_login'),
    # Add other app URLs here
    # path('api/', include('app.urls')),
]
