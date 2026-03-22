import { useDispatch, useSelector } from 'react-redux'
import { INDUSTRY_OPTIONS, setIndustry } from '../redux/filterSlice'

const IndustryFilterDropdown = ({ className = '' }) => {
  const dispatch = useDispatch()
  const { selectedIndustry } = useSelector((state) => state.filter)

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-zinc-300 ${className}`}>
      <span>Industry</span>
      <select
        value={selectedIndustry}
        onChange={(event) => dispatch(setIndustry(event.target.value))}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-red-500 transition focus:ring-2"
      >
        {INDUSTRY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default IndustryFilterDropdown
