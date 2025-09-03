// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 w-full bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-lg font-semibold">DeliveryApp</p>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
        <div className="flex space-x-4">
          <Link href="/about" className="hover:text-gray-300">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-gray-300">
            Contact
          </Link>
          <Link href="/terms" className="hover:text-gray-300">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-gray-300">
            Privacy Policy
          </Link>
        </div>
        <div className="mt-4 md:mt-0">
          <p>Follow us:</p>
          <div className="flex space-x-2">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              Twitter
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              Facebook
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}