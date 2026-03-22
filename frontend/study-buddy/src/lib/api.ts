const API_BASE_URL = 'http://localhost:5001';

export interface User {
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(userData: RegisterData): Promise<LoginResponse> {
  try {
    console.log('Registering user with data:', { ...userData, password: '[REDACTED]' });
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
} 