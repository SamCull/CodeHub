# test_multiples.py
import sys
sys.path.append('./users')  # Adjust this path if necessary
import unittest
from users.prime import prime

class TestPrimeFunction(unittest.TestCase):
    def test_10001st_prime(self):
        self.assertEqual(prime(10001), 104743, "The 10,001st prime number should be 104743")

if __name__ == '__main__':
    unittest.main()

