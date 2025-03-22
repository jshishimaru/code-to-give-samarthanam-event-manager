from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from eventmanager.auth import (
    UserLoginView, HostLoginView, UserSignupView,
    LogoutView, ProfileView, CheckAuthView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # User authentication
    path('api/auth/user/signup/', UserSignupView.as_view(), name='user_signup'),
    path('api/auth/user/login/', UserLoginView.as_view(), name='user_login'),
    
    # Host authentication
    path('api/auth/host/login/', HostLoginView.as_view(), name='host_login'),
    
    # Common authentication endpoints
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/profile/', ProfileView.as_view(), name='profile'),
    path('api/auth/check/', CheckAuthView.as_view(), name='check_auth'),
    
    # Include app URLs
    path('api/app/', include('app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)