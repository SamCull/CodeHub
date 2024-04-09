# test_multiples.py
import sys
sys.path.append('./users')  # Adjust this path if necessary
import unittest
from users.palindrome import palindrome

class TestPalindrome(unittest.TestCase):
    def test_largest_palindrome_product(self):
        """Test the palindrome function for the largest palindrome made from the product of two 3-digit numbers."""
        expected = 906609
        result = palindrome()
        self.assertEqual(expected, result, f"Expected {expected}, got {result}")

if __name__ == '__main__':
    unittest.main()

