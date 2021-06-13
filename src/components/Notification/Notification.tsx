import classes from './Notification.module.css';

const Notification = ({ active, setActive, content, subcontent }) => {

    return (
        <div className={`${classes.Wrapper} ${active ? classes.Active : ''}`}>
            <div onClick={() => setActive(false)} className={classes.Close}>x</div>
            <div className={classes.Notification}>
                <p className={classes.Content}>{content}</p>
                <p className={classes.SubContent}>{subcontent}</p>
            </div>

        </div>
    )
}

export default Notification;