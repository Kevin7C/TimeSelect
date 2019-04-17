import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from 'antd';
import cx from 'classnames';
import css from './index.module.scss'

const TimeSelectPadding=10; //插件的左右padding
const ValueWith = 30;  //时间块宽
const ValueStep = 4;  //时间块 间距

export default class TimeSelect extends React.PureComponent {
    static defaultProps = {
        selectedTime: [],
        disabled: false, //是否禁用 待实现
        startTime: 8,//开始时间
        endTime: 23,//结束时间
        onChange: () => { }
    }
    static propTypes = {
        selectedTime: PropTypes.array,
        disabled: PropTypes.bool,
        startTime: PropTypes.number,
        endTime: PropTypes.number,
        onChange: PropTypes.func

    }
    constructor(props) {
        super();
        const { startTime, endTime } = props;
        let i = startTime;
        const data = [];
        while (i < endTime) {
            data.push({
                text: i < 10 ? '0' + i : i.toString(),
                value: i,
                selected: false,
                startTime: i,
                endTime: i + 1
            })
            i++
        }
        this.state = {
            data: data,
            selectedData: []
        }
        this.refTime = React.createRef();
        this.refEnd = React.createRef();

        this.controlDom = {
            lefTopX: '',
            leftTopY: '',
            rightBottomX: '',
            rightBottomY: ''
        };
        this.selected = {
            type: true, // 添加 true 减少 false
            flag: false, //mouseDown 开始
            start: '', // 开始的数组位置
            end: '',   // 结束的数组位置
            startX: '',  //开始时的距离
        };
        this.direction = {
            X: 0,
            beforeX: 0,
            type: true   //true 向右 向左
        };
        this.stepList = [];// 记录每个时间块的位置
    }
    
    static getDerivedStateFromProps(props,state){
        if(props.selectedTime.length){
            for (const obj of props.selectedTime) {
                const { data } = state;
                let selectedIndex = data.findIndex(item => item.startTime === obj.startTime);
                if (selectedIndex > -1) {
                    while (true) {
                        data[selectedIndex].selected = true;
                        if (data[selectedIndex].endTime === obj.endTime) {
                            break;
                        }
                        selectedIndex++;
                    }
                }
            }
        }
        return state
    }

    componentDidMount() {
        const { startTime, endTime } = this.props;
        const timeDom = this.refTime.current.getBoundingClientRect();
        const endDom = this.refEnd.current.getBoundingClientRect();
        const endX = endDom.x;
        this.controlDom.lefTopX = timeDom.left+TimeSelectPadding;
        this.controlDom.leftTopY = timeDom.top;
        this.controlDom.rightBottomX = timeDom.right-TimeSelectPadding;
        this.controlDom.rightBottomY = timeDom.bottom;
        let i = 0;
        while (i < (endTime - startTime)) {
            this.stepList.unshift({
                start: endX - ValueWith * i - ValueStep * i,
                end: endX - ValueWith * (i - 1),
                index: endTime - startTime - 1 - i
            })
            i++
        }
    }

    handleMouseDown = (index, event) => {
        this.selected.flag = true;
        this.selected.start = index;
        this.selected.type = !this.state.data[this.selected.start].selected;
        this.selected.startX = event.clientX;

        this.direction.x = event.clientX;
        this.direction.beforeX = event.clientX;
    }

    handleMouseUp = (index, event) => {
        if (this.selected.flag) {
            this.selected.flag = false;
            const temp = JSON.parse(JSON.stringify(this.state.data));
            const { start } = this.selected;
            let i = Math.min(start, index);
            const flag = this.selected.type;
            while (i <= Math.max(start, index)) {
                temp[i].selected = flag;
                i++;
            }
            this.setState({
                data: temp
            }, () => {
                this.props.onChange(this.getSelectTime());
            });
        }

    }

    handleMouseMove = (event) => {
        if (this.selected.flag) {
            const { clientX, clientY } = event;
            const { lefTopX, leftTopY, rightBottomX, rightBottomY } = this.controlDom;
            this.direction.beforeX = this.direction.x;
            this.direction.x = clientX;
            let flag = !this.selected.type;

            if (clientX <= lefTopX || clientY <= leftTopY || clientX >= rightBottomX || clientY >= rightBottomY) {
                //判断是否出界
                if (clientX <= lefTopX) {
                    this.handleMouseUp(0);
                    return;
                }
                if (clientX >= rightBottomX) {
                    this.handleMouseUp(14);
                    return;
                }
                const selecteItem = this.stepList.find(item => {
                    return item.start <= clientX && item.end > clientX
                });
                this.handleMouseUp(selecteItem.index);
                return;
            }

            //判断方向
            if (this.direction.x - this.direction.beforeX >= 0 && this.direction.x >= this.selected.startX) {
                flag = this.selected.type;
            }
            if (this.direction.x - this.direction.beforeX < 0 && this.direction.x < this.selected.startX) {
                flag = this.selected.type;
            }
            const temp = JSON.parse(JSON.stringify(this.state.data));
            const selecteItem = this.stepList.find(item => {
                return item.start <= clientX && item.end > clientX
            });
            if(selecteItem){
                temp[selecteItem.index].selected = flag;
                this.setState({
                    data: temp
                })
            }
            

        }
    }

    getSelectTime = () => {
        const backArr = [];
        const { data } = this.state;
        for (let obj of data) {
            if (obj.selected) {
                if (backArr.length > 0) {
                    if (backArr[backArr.length - 1].endTime === obj.startTime) {
                        backArr[backArr.length - 1].endTime = obj.endTime;
                        continue;
                    }
                }
                backArr.push({
                    startTime: obj.startTime,
                    endTime: obj.endTime
                });
            }
        }
        return backArr;
    }

    contentRender = (index) => {
        const { data } = this.state;
        const obj = data[index];
        let start = obj.value;
        let end = obj.value + 1;
        if (obj.selected) {
            let temp = index;
            while (temp > -1) {
                if (!data[temp].selected) {
                    break;
                }
                start = data[temp].value;
                temp--;
            }
            temp = index;
            while (temp < data.length) {
                if (!data[temp].selected) {
                    break;
                }
                end = data[temp].value + 1;
                temp++;
            }
        }
        return (
            <div>
                {`${start}-${end}点`}
            </div>
        )
    }

    dataRender = () => {
        const array = this.state.data.map((item, index) => {
            if (index === this.state.data.length - 1) {
                return (
                    <Tooltip title={this.contentRender.bind(this, index)} key={index}>
                        <span ref={this.refEnd} key={index}
                            className={cx(item.selected ? css.addBlueBox : '', css.shortBox)}
                            onMouseDown={this.handleMouseDown.bind(this, index)}
                            onMouseUp={this.handleMouseUp.bind(this, index)}
                        >
                            <span className={css.valueText}>{item.text}</span>
                            <span className={css.valueTextLast}>{item.value + 1}</span>
                        </span>
                    </Tooltip>
                )
            }
            return (

                <Tooltip title={this.contentRender.bind(this, index)} key={index}>
                    <span key={index}
                        className={cx(item.selected ? css.addBlueBox : '', css.shortBox)}
                        onMouseDown={this.handleMouseDown.bind(this, index)}
                        onMouseUp={this.handleMouseUp.bind(this, index)}

                    >
                        <span className={css.valueText}>{item.text}</span>
                    </span>
                </Tooltip>

            )
        })
        return array
    }
    render() {
        return (
            <div ref={this.refTime} className={css.timeSelect} onMouseMove={this.handleMouseMove}>
                {
                    this.dataRender()
                }
            </div>
        )
    }
}