import classes from './boolIcon.module.scss'

const BoolIcon = ({condition}) => {
  if (condition)
    return <div className={classes.boolIconTrue}/>
  return <div className={classes.boolIconFalse}/>
}

export default BoolIcon