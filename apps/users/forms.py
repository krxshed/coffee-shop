from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
import re

User = get_user_model()

class CustomUserCreationForm(UserCreationForm):
    username = forms.CharField(
        label="Имя пользователя",
        max_length=8,
        help_text="",
        widget=forms.TextInput(attrs={'placeholder': 'Только буквы и цифры, до 8 символов'})
    )
    password1 = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput,
        help_text=""
    )
    password2 = forms.CharField(
        label="Подтверждение пароля",
        widget=forms.PasswordInput,
        help_text=""
    )

    class Meta:
        model = User
        fields = ('username', 'password1', 'password2')
        labels = {
            'username': 'Имя пользователя',
        }
        help_texts = {
            'username': '',
        }

    def clean_username(self):
        username = self.cleaned_data.get('username')
        # Разрешены только латинские буквы и цифры
        if not re.match(r'^[a-zA-Z0-9]+$', username):
            raise forms.ValidationError("Имя пользователя должно содержать только латинские буквы и цифры.")
        if len(username) > 8:
            raise forms.ValidationError("Имя пользователя не может быть длиннее 8 символов.")
        return username