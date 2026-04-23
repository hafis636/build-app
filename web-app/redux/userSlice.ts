import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  isLoggedIn: boolean;
  userInfo: {
    name: string | null;
    email: string | null;
    picture: string | null;
  } | null;
}

const initialState: UserState = {
  isLoggedIn: false,
  userInfo: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ name: string; email: string; picture: string }>) => {
      state.isLoggedIn = true;
      state.userInfo = action.payload;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userInfo = null;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userInfo');
    },
    setUserInfo: (state, action: PayloadAction<{ name: string; email: string; picture: string } | null>) => {
        if (action.payload) {
            state.isLoggedIn = true;
            state.userInfo = action.payload;
        } else {
            state.isLoggedIn = false;
            state.userInfo = null;
        }
    }
  },
});

export const { login, logout, setUserInfo } = userSlice.actions;
export default userSlice.reducer;
