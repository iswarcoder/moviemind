import { createSlice } from '@reduxjs/toolkit'

export const INDUSTRY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Hollywood', value: 'hollywood' },
  { label: 'Bollywood', value: 'bollywood' },
  { label: 'Tollywood', value: 'tollywood' },
  { label: 'Others', value: 'others' },
]

const initialState = {
  selectedIndustry: 'all',
}

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setIndustry(state, action) {
      state.selectedIndustry = action.payload
    },
  },
})

export const { setIndustry } = filterSlice.actions
export default filterSlice.reducer
