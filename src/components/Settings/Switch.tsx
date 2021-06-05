
const Switch = ({ active, toggle }: { active: boolean, toggle: () => void }) => {

    return (
        <div className={`switch ${active ? 'active' : ''}`}>
            <div className='container'></div>
            <div onClick={toggle} className='knob'></div>
        </div>
    )
};

export default Switch;