import unittest
from users.smallestMultiple import smallestMultiple

class TestSmallestMultiple(unittest.TestCase):
    def test_smallest_multiple(self):
        self.assertEqual(smallestMultiple(), 232792560, "Should return the smallest multiple evenly divisible by all numbers from 1 to 20")

if __name__ == '__main__':
    unittest.main()
