# events/forms.py
from django import forms
from .models import Event, Finance


class EventForm(forms.ModelForm):
    event_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Event Name',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
        }),
        label=''
    )

    user_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Username',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
        }),
        label=''
    )

    password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Password',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
        }),
        label=''
    )

    event_amount = forms.CharField(
        max_length=10,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Event Amount',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
        }),
        label=''
    )

    class Meta:
        model = Event  # Ensure this line correctly specifies the model
        fields = ['event_name', 'user_name', 'password', 'event_amount']

class LoginForm(forms.Form):
    user_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Username',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
            }),
        
        label=''
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Password',
            'style': 'box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
            }),
        label=''
    )

class FinanceForm(forms.ModelForm):
    class Meta:
        model = Finance
        fields = ['from_person', 'to_person', 'description', 'amount', 'date_event', 'mode']
        labels = {
            'from_person': '',
            'to_person': '',
            'description': '',
            'amount': '',
            'date_event': '',
            'mode': ''
        }
        widgets = {
            'from_person': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'From'}),
            'to_person': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'To'}),
            'description': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Description'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Amount'}),
            'date_event': forms.DateInput(attrs={
                'class': 'form-control', 
                'placeholder': 'DD-MM-YYYY', 
                'type': 'text'  # Optional, to make sure it's a text input field
            }, format='%d-%m-%Y'),
            'mode': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Mode'}),
        }

    # Specify input formats for the date_event field
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['date_event'].input_formats = ['%d-%m-%Y']


