import classes from './Notification.module.css';

const Notification = ({ active, scoring }) => {

    return (
        <div className={`${classes.Wrapper} ${active ? classes.Active : ''}`}>
            {/* <div className={`${classes.Container} ${active ? classes.Active : ''}`}> */}
                {/* <div onClick={() => setActive(false)} className={classes.Close}>x</div> */}
                
                <div className={classes.Notification}>
                    <p className={classes.Content}>New Bingo!!!</p>
                    <p className={classes.SubContent}>Congratulations! {scoring ? 'Additinal 200 points has also been added to your score!' : ''}</p>
                </div>
            {/* </div> */}

        </div>
    )
}

export default Notification;