# events/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from .models import Event, Finance
from .forms import EventForm, LoginForm, FinanceForm
from django.contrib import messages
from decimal import Decimal
import json
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST
from datetime import datetime

def main_view(request):
    events = Event.objects.all()
    
    return render(request, 'events/index.html', {
        'events': events
    })


def event_creation_view(request):
    # Handle event creation
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('index')
    else:
        form = EventForm()
    return render(request, 'events/event_creation.html', {'form': form})

def login_view(request):
    # Handle login functionality
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user_name = form.cleaned_data['user_name']
            password = form.cleaned_data['password']
            events = Event.objects.filter(user_name=user_name, password=password)

            if user_name == 'Legacyiedc' and password == '8474244':
                return render(request, 'events/index.html', {
                    'events': Event.objects.all(), 
                    'show_add_button': True,
                    'show_edit_button': True,
                    'show_delete_menu': True  # New flag for showing delete menu
                })
            elif events.exists():
                return render(request, 'events/index.html', {
                    'events': events, 
                    'show_add_button': False,
                    'show_edit_button': False,
                    'show_delete_menu': False  # Don't show delete menu for other users
                })
            else:
                # If credentials are invalid, add an error message
                messages.error(request, 'Invalid username or password')
                return render(request, 'events/login.html', {'form': form})
    else:
        form = LoginForm()

    return render(request, 'events/login.html', {'form': form})

    

def add_finance_view(request, event_id):
    # Handle adding finance for an event
    event = get_object_or_404(Event, id=event_id)

    if request.method == 'POST':
        form = FinanceForm(request.POST)
        if form.is_valid():
            finance = form.save(commit=False)
            date_str = form.cleaned_data['date_event'].strftime('%d-%m-%Y')
            finance.date_event = datetime.strptime(date_str, '%d-%m-%Y').date()
            finance.event = event
            finance.save()
            return redirect('add_finance', event_id=event.id)  # Redirect back to main page or user page as needed
    else:
        form = FinanceForm()

    return render(request, 'events/add_finance.html', {'form': form, 'event': event})



@require_POST
def delete_event(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
        event.delete()
        return JsonResponse({'status': 'success'})
    except Event.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Event not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def create_event(request):
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save()
            return redirect('index')
    else:
        form = EventForm()
    return render(request, 'events/event_creation.html', {'form': form})



def event_creation(request, event_id=None):
    if event_id:
        event = get_object_or_404(Event, id=event_id)
        form = EventForm(instance=event)
        credentials = {
            'username': event.username,
            'password': event.password
        }
        print(f"Debug: Credentials fetched for event {event_id}: {credentials}")  # Debug print
    else:
        form = EventForm()
        credentials = None
        print("Debug: No event_id provided, credentials are None")  # Debug print

    context = {
        'form': form,
        'credentials': credentials
    }
    return render(request, 'events/event_creation.html', context)



def edit_event(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if request.method == 'POST':
        form = EventForm(request.POST, instance=event)
        if form.is_valid():
            form.save()
            return redirect('index')  # Redirect to the events list page after successful edit
    else:
        form = EventForm(instance=event)
    
    return render(request, 'events/event_creation.html', {'form': form, 'edit_mode': True})

def index(request):
    events = Event.objects.all()
    show_add_button = True  # or whatever logic you use to determine this
    show_edit_button = True  # You can set this based on user permissions or other logic
    context = {
        'events': events,
        'show_add_button': show_add_button,
        'show_edit_button': show_edit_button,
    }
    return render(request, 'events/index.html', context)
