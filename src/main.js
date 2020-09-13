import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import {
    Button,
    ButtonGroup,
    Checkbox,
    Col,
    Container,
    Footer,
    Icon,
    Input,
    Image,
    Link,
    Main,
    Message,
    Notification,
    Progress,
    Popover,
    Radio,
    RadioGroup,
    RadioButton,
    Row,
    Table,
    TableColumn,
    Tooltip,
    Upload
} from 'element-ui';
import 'element-ui/lib/theme-chalk/base.css';

Vue.use(Link);
Vue.use(Image);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Main);
Vue.use(Footer);
Vue.use(Container);
Vue.use(Icon);
Vue.use(Input);
Vue.use(Row);
Vue.use(Col);
Vue.use(Upload);
Vue.use(Checkbox);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Tooltip);
Vue.use(Progress);
Vue.use(Popover);
Vue.prototype.$notify = Notification;
Vue.prototype.$notice = Notification;

Vue.config.productionTip = false;
document.getElementById("loader-source").remove()
new Vue({
    render: h => h(App),
}).$mount('#app');
