// import React from 'react'
// import Navbar from './components/Navbar'
// import { Route, Routes, useLocation } from 'react-router-dom'
// import Home from './pages/Home'
// import Movies from './pages/Movies'
// import MovieDetails from './pages/MovieDetails'
// import SeatLayout from './pages/SeatLayout'
// import MyBookings from './pages/MyBookings'
// import Favorite from './pages/Favorite'
// import {Toaster} from 'react-hot-toast'
// import Footer from './components/Footer'
// import Layout from './pages/admin/Layout'
// import Dashboard from './pages/admin/Dashboard'
// import ListShows from './pages/admin/ListShows'
// import AddShows from './pages/admin/AddShows'
// import ListBookings from './pages/admin/ListBookings'
// import { useAppContext } from './context/AppContext'
// import { SignIn } from '@clerk/clerk-react'

// const App = () => {

//     const isAdminRoute = useLocation().pathname.startsWith('/admin')

//     const { user, isAdmin, isCheckingAdmin } = useAppContext() // Add isCheckingAdmin here

//     // REMOVE all comments below:

//     if (!user && isAdminRoute) { // If user is not logged in AND trying to access admin route
//         return (
//             <div className='min-h-screen flex justify-center items-center'>
//                 <SignIn fallbackRedirectUrl={'/admin'}/>
//             </div>
//         )
//     }

//     if (isCheckingAdmin) { // If user is logged in, but we are checking the admin role
//         return null // Block rendering to prevent flash
//     }


//     return (
//         <>

//             <Toaster/>
//             { !isAdminRoute && < Navbar/>}
//             <Routes>
//                 <Route path='/' element={<Home/>} />
//                 <Route path='/Movies' element={<Movies/>}/>
//                 <Route path='/Movies/:id' element={<MovieDetails/>}/>
//                 <Route path='/Movies/:id/:date' element={<SeatLayout/>}/>
//                 <Route path='/mybookings' element={<MyBookings/>}/>
//                 <Route path='/favorite' element={<Favorite/>}/>
//                 <Route path='/admin/*' element={isAdmin ? <Layout/> : ( 
//                     <div className='min-h-screen flex justify-center items-center text-white text-2xl'>
//                         You are not authorized!
//                     </div>
//                 )}>
//                     <Route index element={<Dashboard/>}/>
//                     <Route path='add-shows' element={<AddShows/>}/>
//                     <Route path='list-shows' element={<ListShows/>}/>
//                     <Route path='list-bookings' element={<ListBookings/>}/>
//                 </Route>
//             </Routes>
//             { !isAdminRoute && <Footer/>}
//         </>
//     )
// }

// export default App

import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import ListShows from './pages/admin/ListShows'
import AddShows from './pages/admin/AddShows'
import ListBookings from './pages/admin/ListBookings'
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin');
  const { user } = useAppContext(); 

  return (
    <>
      <Toaster />
      { !isAdminRoute && <Navbar /> }

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:date' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/loading/:nextUrl' element={<Loading />} />
        <Route path='/favorite' element={<Favorite />} />

        <Route path='/admin/*' element={
          user ? (
            <Layout />
          ) : (
            <div className='min-h-screen flex justify-center items-center'>
              <SignIn fallbackRedirectUrl={'/admin'} />
            </div>
          )
        }>
          <Route index element={<Dashboard />} />
          <Route path='add-shows' element={<AddShows />} />
          <Route path='list-shows' element={<ListShows />} />
          <Route path='list-bookings' element={<ListBookings />} />
        </Route>
      </Routes>

      { !isAdminRoute && <Footer /> }
    </>
  )
}

export default App
