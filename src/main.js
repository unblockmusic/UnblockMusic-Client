import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import {
    Button, Col, Container, Footer, Icon, Image, Link, Main,
    Row, Table, TableColumn, Upload, Radio, RadioGroup, RadioButton, Checkbox, Switch,
    Notification, Popover, Input
} from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(Link);
Vue.use(Image);
Vue.use(Button);
Vue.use(Switch);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Main);
Vue.use(Footer);
Vue.use(Container);
Vue.use(Icon);
Vue.use(Row);
Vue.use(Col);
Vue.use(Upload);
Vue.use(Checkbox);
Vue.use(Radio);
Vue.use(Popover);
Vue.use(Input);
Vue.prototype.$notify = Notification;

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');
