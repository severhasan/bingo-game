import classes from './ComputerCard.module.css';
const ComputerCard = ({ matchIndices }: {matchIndices: number[]}) => {

    return (
        <div className={classes.ComputerCard}>
            <div className={classes.Container}>
                {
                    Array.from(new Array(25).keys()).map(idx => (
                        <div key={`card_cell_${idx}`} className={[classes.Cell, idx === 12 ? classes.FreeBingo : '', matchIndices.includes(idx) ? classes.Selected : ''].join(' ')}></div>
                    ))
                }
            </div>
        </div>
    )
};

export default ComputerCard;