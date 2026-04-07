import React, { Component, useState, useCallback, useEffect } from 'react';
import { Search, Mic } from 'lucide-react';

type SportType = 'football' | 'basketball' | 'baseball'

export type SearchBarType = {
    sport?: SportType
    isLoading?: boolean
    
}

class SearchData extends Component {
    static filter(arg0: (item: any) => any) {
        throw new Error('Method not implemented.');
    }
    state = {
        searchTerm: "",
        data: [],
        filterdData: [],
    }

    useEffect(() => {
        fetch(`https://openlibrary.org/subjects/drama.jon?published_in=2000&name=${search}`)
            .then(res => res.json())
        }
    )
}

const PlayerSearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])

    const debounce = (func, delay) => {
        let timeoutId: number | undefined
        return (...args) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func(...args), delay)
        }
    }

    const handleSearch = useCallback(
        debounce((term) => {
            if (term.trim() === '') {
                setSearchResults([])
            } else {
                const results = SearchData.filter((item) =>
                    item.title.toLowerCase().includes(term.toLowerCase()),
                )
                setSearchResults(results)
            }
        }, 300),
        [],
    )

    useEffect(() => {
        handleSearch(searchTerm)
    }, [searchTerm, handleSearch])

    const handleInputChange = (e: React.ChangeEvent<any>) => {
        setSearchTerm(e.target.value)
    }
}


export default PlayerSearchBar