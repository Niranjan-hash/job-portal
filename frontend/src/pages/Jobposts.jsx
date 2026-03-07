import Joblist from "../component/Joblist";
import React from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function Jobposts() {
  useGSAP(() => {
    gsap.fromTo('.jobist', { opacity: 0 }, { opacity: 1, duration: 0.8 });
  }, []);

  return (
    <div className="jobist">
      {<Joblist/>}
    </div>
  )
}

export default Jobposts
