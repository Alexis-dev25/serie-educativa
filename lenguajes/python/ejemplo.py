#generador de contraseñas
import random
print(" ")
letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9" "0"]
simbols = ["@", "#", "$", "%", "&", "*", "=", "+", "-", "^", "~", ">", "<", "{", "}", "[", "]"]
company = input("Empresa para la que quieres el password: ")
# generar caracteres aleatorios
random_letters = random.sample(letters, 6)
random_numbers = random.sample(numbers, 2)
random_symbol = random.sample(simbols, 1)

#combinar los caracteres
password_parts = random_letters + random_numbers + random_symbol + [company]
random.shuffle(password_parts)

#crear la contraseña final
password = "".join(password_parts)
print(" ")
print(f"Tu password es: {password}")