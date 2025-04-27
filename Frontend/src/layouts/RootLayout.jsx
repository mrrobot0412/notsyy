import {Outlet, useNavigate} from "react-router-dom";
import {assets} from "../assets/assets.js";

const RootLayout = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/auth/register');
  };

  return (
    <div className="h-screen px-16 py-5 bg-base-white overflow-y-auto no-scrollbar">
      {/* Shared Navigation */}
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2 ">
          <img className="w-8 h-8" src={assets.logo} alt="Logo"/>
          <h1 className="text-4xl font-black">NOTSY</h1>
        </div>
        <div>
          <ul className="flex rounded-lg items-center bg-base-navgray py-2 px-6 text-lg gap-4">
            <li className="hover:bg-base-black px-2 py-1 rounded-md">
              <a href="/">Home</a>
            </li>
            <span>|</span>
            <li>
              <a href="/about">About</a>
            </li>
            <span>|</span>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </div>
        <button onClick={handleGetStarted} className="text-xl bg-base-black text-white py-2 px-4 rounded-lg">
          Get Started
        </button>
      </nav>

      {/* Main Content Area */}
      <Outlet/>

      {/* Shared Footer */}
      <footer className="relative">
        <div>
          <h1 className="text-9xl font-bold">Level Up.</h1>
        </div>
        <div className="flex items-start justify-between mt-20">
          <div className="flex gap-4">
            <div className="border w-10 h-10 rounded-full border-base-black"></div>
            <div className="border w-10 h-10 rounded-full border-base-black"></div>
            <div className="border w-10 h-10 rounded-full border-base-black"></div>
            <div className="border w-10 h-10 rounded-full border-base-black"></div>
          </div>
          <div className="flex gap-16">
            <ul>
              <li className="text-lg font-bold">Notsy</li>
              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
            <ul>
              <li className="text-lg font-bold">Company</li>
              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
            <ul>
              <li className="text-lg font-bold">Resources</li>
              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
            <ul>
              <li className="text-lg font-bold">Support</li>
              <li>About</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div></div>
        </div>
        <div className="flex justify-center mt-20">
          <button onClick={handleGetStarted}
                  className="text-xl bg-base-black text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300">
            Get Started
          </button>
        </div>
        <div className="flex gap-10 justify-center mt-5 text-gray-500 text-sm">
          <p>Terms of use </p>
          <p>Privacy Policies</p>
          <p>Cookie Prefrences</p>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
