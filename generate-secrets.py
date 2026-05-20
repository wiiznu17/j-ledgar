#!/usr/bin/env python3
import os
import secrets
import string
import sys

def generate_secure_password(length=16):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_hex_token(bytes_len=32):
    return secrets.token_hex(bytes_len)

def main():
    example_path = ".env.example"
    output_path = ".env"

    if not os.path.exists(example_path):
        print(f"Error: {example_path} not found in the current directory.")
        sys.exit(1)

    if os.path.exists(output_path):
        confirm = input(f"Warning: {output_path} already exists! Overwrite? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Operation cancelled. Existing .env file was not modified.")
            sys.exit(0)

    # Variables requiring cryptographically secure random values
    hex_keys = {
        "PII_ENCRYPTION_KEY",
        "JLEDGER_INTERNAL_SECRET",
        "CUSTOMER_JWT_SECRET",
        "CUSTOMER_REFRESH_SECRET",
        "CUSTOMER_REGISTRATION_SECRET",
        "ADMIN_JWT_SECRET",
        "ADMIN_REFRESH_SECRET"
    }

    password_keys = {
        "POSTGRES_PASSWORD",
        "REDIS_PASSWORD",
        "JLEDGER_ADMIN_PASSWORD"
    }

    generated_count = 0
    with open(example_path, "r", encoding="utf-8") as f_in, open(output_path, "w", encoding="utf-8") as f_out:
        for line in f_in:
            stripped = line.strip()
            # Preserve comments and empty lines
            if not stripped or stripped.startswith("#"):
                f_out.write(line)
                continue

            # Parse key-value pairs
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip()

                if key in hex_keys:
                    new_val = generate_hex_token(32)
                    f_out.write(f"{key}={new_val}\n")
                    generated_count += 1
                elif key in password_keys:
                    new_val = generate_secure_password(16)
                    f_out.write(f"{key}={new_val}\n")
                    generated_count += 1
                else:
                    # Keep non-sensitive settings/placeholders from .env.example
                    f_out.write(line)
            else:
                f_out.write(line)

    print("\n==================================================")
    print(f"Success: A new secure '{output_path}' file has been created!")
    print(f"Generated {generated_count} cryptographically secure keys and passwords.")
    print("Please review the remaining settings (e.g. AWS, Stripe, SMTP) and customize them as needed.")
    print("==================================================\n")

if __name__ == "__main__":
    main()
