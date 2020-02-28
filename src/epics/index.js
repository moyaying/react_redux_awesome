import {combineEpics} from "redux-observable";

import {demoEpics} from './demo'

export default combineEpics(
  demoEpics,
  //继续添加你的action拦截逻辑
)