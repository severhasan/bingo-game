
const Switch = ({ disabled, active, toggle }: { disabled: boolean, active: boolean, toggle: () => void }) => {

    return (
        <div className={`switch ${active ? 'active' : ''} ${disabled && 'disabled'}`}>
            <div className='container'></div>
            <div onClick={disabled ? null : toggle} className='knob'></div>
        </div>
    )
};

export default Switch;