import * as React from "react";
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import './stylesheet.css'


const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    color: '#002145',
    border: 1,
    borderColor: '#002145',
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: "auto",
    width: 'auto',
    [theme.breakpoints.up('sm')]: {
      marginLeft: "auto",
      width: 'auto',
    },
  }));
  
  const SearchIconWrapper = styled('div')(({ theme }) => ({
    fontSize: "1.0rem",
    [theme.breakpoints.up('sm')]: {
      fontSize: "1.25rem",
    },
    [theme.breakpoints.up('md')]: {
      fontSize: "1.5rem",
    },
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#002145'
  }));
  
  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    
    fontSize: "0.75rem",
    [theme.breakpoints.up('sm')]: {
      fontSize: "0.875rem",
    },
    [theme.breakpoints.up('md')]: {
      fontSize: "1.0rem",
    },
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create('width'),
      width: '17ch',
    },
  }));  

export default function Search_Bar(props){
    return(
        <Search>
            <SearchIconWrapper>
              <SearchIcon sx={{fontSize: 'inherit'}} />
            </SearchIconWrapper>
            <StyledInputBase
              sx={{border: 1}}
              placeholder="Search Researchers"
              inputProps={{ 'aria-label': 'search' }}
            />
        </Search>
    );
}