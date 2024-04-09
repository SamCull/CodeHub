# test_multiples.py
import sys
sys.path.append('./users')  # Adjust this path if necessary
import unittest
from users.fibonacci import fibonacci

class TestFibonacciFunction(unittest.TestCase):
    def test_fibonacci_sum(self):
        self.assertEqual(fibonacci(4000000), 4613732, "Should calculate the correct sum of even-valued Fibonacci terms not exceeding four million.")

if __name__ == '__main__':
    unittest.main()

