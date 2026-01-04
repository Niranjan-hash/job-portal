import axios from "axios";
import Searchbar from "../component/Searchbar"
import './dashboard.css'
import { useState, useEffect } from "react";
import Joblist from "../component/Joblist";
import { useSearchbarVisibility } from "../hooks/useSearchbarVisibility";

function Dashboard(){
 const [data, setdata] = useState("")
 const { isVisible, show, hide } = useSearchbarVisibility();
 // FIX: Wrap axios call in useEffect to prevent infinite re-renders
 useEffect(() => {
   axios.get("http://localhost/dashboard").then(
     res => {
       setdata(res.data)
     }
   )
 }, []) // Empty dependency array means this runs only once

    return(
      <div className="home_page">
         <div className="pages">
        {isVisible && <div className="com-1">{<Searchbar/>}</div>}
        <div className="com-2">{<Joblist showSearchbar={show} hideSearchbar={hide} />}</div>

         </div>
      </div>  
    )
}
export default  Dashboard;