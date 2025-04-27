import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets.js";

const Landing = () => {
  const navigate = useNavigate();

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);

  const handleGetStarted = () => {
    navigate("/auth/register");
  };

  const scrollToSection = (elementRef) => {
    elementRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="h-screen bg-base-white overflow-y-auto no-scrollbar relative">
        {/* Navigation Bar */}
        <nav className="flex  px-16 py-5 items-center justify-between top-0 p-2 rounded-lg z-50">
          <div className="flex items-center gap-2">
            <img className="w-8 h-8" src={assets.logo} alt="Logo" />
            <h1 className="text-4xl font-black">NOTSY</h1>
          </div>
          <div>
            <ul className="flex rounded-lg items-center bg-base-navgray py-2 px-6 text-lg gap-4">
              <li className="hover:bg-base-black hover:text-white px-2 py-1 rounded-md cursor-pointer transition-all">
                <button onClick={() => scrollToSection(homeRef)}>Home</button>
              </li>
              <span>|</span>
              <li className="hover:bg-base-black hover:text-white px-2 py-1 rounded-md cursor-pointer transition-all">
                <button onClick={() => scrollToSection(featuresRef)}>
                  Features
                </button>
              </li>
              <span>|</span>
              <li className="hover:bg-base-black hover:text-white px-2 py-1 rounded-md cursor-pointer transition-all">
                <button onClick={() => scrollToSection(aboutRef)}>About</button>
              </li>
            </ul>
          </div>
          <button
            onClick={handleGetStarted}
            className="text-xl bg-base-black text-white py-2 px-4 rounded-lg"
          >
            Get Started
          </button>
        </nav>

        <main className=" px-16 py-5">
          <section
            ref={homeRef}
            className="flex items-center justify-center min-h-[calc(100vh-200px)]"
          >
            <div className="max-w-2xl flex flex-col items-center">
              <h2 className="text-3xl font-bold text-center">
                One platform to simplify learning with AI and visual
                connections.
              </h2>
              <h1 className="flex items-center gap-8 mt-20 text-9xl font-bold text-nowrap">
                Link{" "}
                <span className="bg-base-black text-8xl px-6 py-2 rounded-xl text-white font-do-hyeon">
                  &
                </span>{" "}
                Learn
              </h1>
              <button
                onClick={handleGetStarted}
                className="flex gap-4 px-8 items-center mt-14 py-3 bg-primary text-white rounded-lg text-xl font-medium hover:bg-primary-hover transition-all"
              >
                <img className="w-10 h-10" src={assets.buttonicons} alt="" />
                Get Started
              </button>
            </div>
          </section>

          {/* Hero Image Section */}
          <section>
            <img
              className="rounded-xl drop-shadow-xl hover:grow shadow-primary"
              src={assets.HeroImage}
              alt=""
            />
          </section>

          {/* Features Section */}
          <section ref={featuresRef} className="mt-32 min-h-screen">
            <h3 className="text-4xl font-bold text-center">Key Features</h3>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {/* AI Chat Feature */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">AI-Powered Chat</h4>
                <p className="text-gray-600">
                  Engage in intelligent conversations with our AI assistant to
                  better understand your study materials and get instant help.
                </p>
              </div>

              {/* Visual Graph Feature */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🔗</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">
                  Visual Knowledge Graph
                </h4>
                <p className="text-gray-600">
                  Visualize connections between your notebooks, topics, and
                  resources with our interactive knowledge graph system.
                </p>
              </div>

              {/* Resource Management */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📚</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">
                  Resource Management
                </h4>
                <p className="text-gray-600">
                  Organize your study materials with notebooks and topics.
                  Upload videos and PDFs for easy access and reference.
                </p>
              </div>

              {/* Smart Organization */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📋</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">Smart Organization</h4>
                <p className="text-gray-600">
                  Create structured notebooks and topics to keep your learning
                  materials organized and easily accessible.
                </p>
              </div>

              {/* Interactive Learning */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">
                  Interactive Learning
                </h4>
                <p className="text-gray-600">
                  Engage with your study materials through interactive features,
                  including AI chat assistance and visual connections.
                </p>
              </div>

              {/* Progress Tracking */}
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">Progress Tracking</h4>
                <p className="text-gray-600">
                  Monitor your learning journey with detailed statistics,
                  streaks, and usage analytics.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <button
                onClick={handleGetStarted}
                className="bg-primary text-white px-8 py-4 rounded-xl text-xl font-medium hover:bg-primary-hover transition-all"
              >
                Start Learning Now
              </button>
            </div>
          </section>

          {/* About Section */}
          <section ref={aboutRef} className="mt-32 min-h-screen">
            <h3 className="text-4xl font-bold text-center">About Us</h3>
            <p className="mt-6 text-xl text-gray-600 text-center">
              Notsy is dedicated to revolutionizing the way students learn and
              interact with study materials. Our AI-powered tools are designed
              to make studying more efficient and effective.
            </p>
          </section>

          {/* Stats Section */}
          <section className="mt-32 py-16 bg-gray-50 rounded-2xl">
            <div className="flex justify-around text-center">
              <div>
                <h4 className="text-5xl font-bold text-primary">10K+</h4>
                <p className="mt-2 text-gray-600">Active Users</p>
              </div>
              <div>
                <h4 className="text-5xl font-bold text-primary">50K+</h4>
                <p className="mt-2 text-gray-600">Documents Analyzed</p>
              </div>
              <div>
                <h4 className="text-5xl font-bold text-primary">99%</h4>
                <p className="mt-2 text-gray-600">Satisfaction Rate</p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative mt-20">
          {/* Blob Background */}
          <div className="absolute bottom-0 right-0 w-[1400px] z-10">
            <div className="absolute inset-0" />
            <img
              src={assets.Blob}
              alt=""
              className="w-full h-full object-cover filter blur-sm animate-blob"
            />
          </div>

          {/* Footer Content */}
          <div className="px-16 relative z-20">
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
              <button
                onClick={handleGetStarted}
                className="text-xl bg-base-black text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
            <div className="flex gap-10 justify-center mt-5 text-gray-500 text-sm">
              <p>Terms of use </p>
              <p>Privacy Policies</p>
              <p>Cookie Prefrences</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
