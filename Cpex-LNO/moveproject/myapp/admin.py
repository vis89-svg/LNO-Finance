

# Register your models here.
from django.contrib import admin
from .models import Event, Finance

# Admin configuration for the Event model
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'user_name')
    search_fields = ('event_name', 'user_name')
    list_filter = ('event_name',)
    ordering = ('event_name',)

# Admin configuration for the Finance model
@admin.register(Finance)
class FinanceAdmin(admin.ModelAdmin):
    list_display = ('event', 'from_person', 'to_person', 'amount', 'date_event', 'mode')
    search_fields = ('event__event_name', 'from_person', 'to_person')
    list_filter = ('event', 'mode', 'date_event')
    ordering = ('-date_event',)
    raw_id_fields = ('event',)

