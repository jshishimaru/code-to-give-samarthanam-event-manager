from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from eventmanager.auth import user_signup , user_login, host_login
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/user/signup/', user_signup, name='user_signup'),
    path('api/auth/user/login/', user_login, name='user_login'),
    path('api/auth/host/login/', host_login, name='host_login'),
	path('api/app/', include('app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)