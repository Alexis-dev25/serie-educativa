using System;

class Program
{
    static void Main()
    {
        Console.Write("Ingresa un número: ");
        int a = int.Parse(Console.ReadLine());

        Console.Write("Ingresa otro número: ");
        int b = int.Parse(Console.ReadLine());

        int resultado = a + b;

        Console.WriteLine("La suma es: " + resultado);
    }
}
