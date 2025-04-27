import { Outlet } from "react-router-dom";
import { assets } from '../assets/assets.js'

const AuthLayout = () => {
  return (
    <div 
      className="min-h-screen flex flex-col gap-10 items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${assets.background})` }}
    >
      <div className="flex flex-col mt-10 gap-5 items-center">
        <div className="flex items-center space-x-2">
          <img className="w-8 h-8" src={assets.logo} alt="Logo"/>
          <h1 className="text-4xl font-bold">NOTSY</h1>
        </div>
        <p className="text-2xl font-semibold">Sign in to your account</p>
      </div>
      <div className="max-w-md w-full p-8 bg-base-white rounded-xl shadow-lg bg-opacity-95 backdrop-blur-sm">
        <Outlet/>
      </div>
    </div>
  );
};

export default AuthLayout;