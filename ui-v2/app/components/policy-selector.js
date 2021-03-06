import ChildSelectorComponent from './child-selector';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import updateArrayObject from 'consul-ui/utils/update-array-object';

const ERROR_PARSE_RULES = 'Failed to parse ACL rules';
const ERROR_INVALID_POLICY = 'Invalid service policy';
const ERROR_NAME_EXISTS = 'Invalid Policy: A Policy with Name';

export default ChildSelectorComponent.extend({
  repo: service('repository/policy/component'),
  datacenterRepo: service('repository/dc/component'),
  name: 'policy',
  type: 'policy',
  allowServiceIdentity: true,
  classNames: ['policy-selector'],
  init: function() {
    this._super(...arguments);
    const source = this.source;
    if (source) {
      const event = 'save';
      this.listen(source, event, e => {
        this.actions[event].bind(this)(...e.data);
      });
    }
  },
  reset: function(e) {
    this._super(...arguments);
    set(this, 'isScoped', false);
    set(this, 'datacenters', this.datacenterRepo.findAll());
  },
  refreshCodeEditor: function(e, target) {
    const selector = '.code-editor';
    this.dom.component(selector, target).didAppear();
  },
  error: function(e) {
    const item = this.item;
    const err = e.error;
    if (typeof err.errors !== 'undefined') {
      const error = err.errors[0];
      let prop = 'Rules';
      let message = error.detail;
      switch (true) {
        case message.indexOf(ERROR_PARSE_RULES) === 0:
        case message.indexOf(ERROR_INVALID_POLICY) === 0:
          prop = 'Rules';
          message = error.detail;
          break;
        case message.indexOf(ERROR_NAME_EXISTS) === 0:
          prop = 'Name';
          message = message.substr(ERROR_NAME_EXISTS.indexOf(':') + 1);
          break;
      }
      if (prop) {
        item.addError(prop, message);
      }
    } else {
      // TODO: Conponents can't throw, use onerror
      throw err;
    }
  },
  actions: {
    open: function(e) {
      this.refreshCodeEditor(e, e.target.parentElement);
    },
    loadItem: function(e, item, items) {
      const target = e.target;
      // the Details expander toggle, only load on opening
      if (target.checked) {
        const value = item;
        this.refreshCodeEditor(e, target.parentNode);
        if (get(item, 'template') === 'service-identity') {
          return;
        }
        // potentially the item could change between load, so we don't check
        // anything to see if its already loaded here
        // TODO: Temporarily add dc here, will soon be serialized onto the policy itself
        const slugKey = this.repo.getSlugKey();
        const slug = get(value, slugKey);
        updateArrayObject(items, this.repo.findBySlug(slug, this.dc, this.nspace), slugKey, slug);
      }
    },
  },
});
