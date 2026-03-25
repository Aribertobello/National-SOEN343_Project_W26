import { useState, useEffect } from 'react'
import appLogo from '/appicon.svg'
import Header from './components/navigation/Header'
import { Outlet } from "react-router-dom";
import { loadMyRentals } from '@/services/rentalService';


function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    loadMyRentals().catch(console.error);
  }, []);

  return (
    <div className='flex flex-col items-center py-5'>
    <Header/>
      <div className='bg-background'>
        <a href="https://vite.dev" target="_blank">
          <img src={appLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <Outlet/>
    </div>
  )
}

export default App
