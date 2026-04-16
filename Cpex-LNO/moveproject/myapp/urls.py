# events/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('index/', views.main_view, name='index'),
    path('create-event/', views.event_creation_view, name='create_event'),
    path('add-finance/<int:event_id>/', views.add_finance_view, name='add_finance'),  # New path for adding finance
    path('delete-event/<int:event_id>/', views.delete_event, name='delete_event'),
    
    path('', views.login_view, name='login'),
    path('edit-event/<int:event_id>/', views.edit_event, name='edit_event'),
]
