import './searchbar.css'
import { useEffect, useState } from 'react'
import axios from 'axios'
import SearchBar from '/src/assets/search-2913.png'

function Searchbar() {
  const [inputvalue, setinputvalue] = useState("")
  const [searchresult, setsearchresult] = useState([])

 useEffect(() => {
  const handler = setTimeout(() => {
    if (!inputvalue.trim()) {
      setsearchresult([])
      return
    }

    axios
      .get(`http://localhost:5000/search`, {
        params: { search: inputvalue }
      })
      .then(res => setsearchresult(res.data))
      .catch(err => console.error(err))
  }, 500)

  return () => clearTimeout(handler)
}, [inputvalue])


  const searchvalues = (e) => {
    setinputvalue(e.target.value)
  }

  const handleclick = () => {
    setinputvalue("")
    setsearchresult([])
  }

  return (
    <div className="search-continer">
      <div className="continer">
        <div className="body">
          <div className="search">
            <div className="searchbar">
              <input
                type="text"
                placeholder="search here"
                value={inputvalue}
                onChange={searchvalues}
              />
              <img
                src={SearchBar}
                alt="search-icon"
                onClick={handleclick}
              />
            </div>

            {/* <div className="list">
              <ul>
                {inputvalue && searchresult.length === 0 && (
                  <li>No data found</li>
                )}

                {searchresult.map(item => (
                  <li
                    key={item._id}
                    onClick={() => {
                      setinputvalue(item.title)
                      setsearchresult([])
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            </div> */}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Searchbar
