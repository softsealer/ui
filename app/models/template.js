import Ember from 'ember';
import Resource from 'ember-api-store/models/resource';
import C from 'ui/utils/constants';

export default Resource.extend({
  projects: Ember.inject.service(),
  settings: Ember.inject.service(),
  intl: Ember.inject.service(),

  cleanProjectUrl: Ember.computed('links.project', function() {
    let projectUrl = this.get('links.project');
    let pattern = new RegExp('^([a-z]+://|//)', 'i');

    if (projectUrl) {
      if (!pattern.test(projectUrl)) {
        projectUrl = `http://${projectUrl}`;
      }
    }

    return Ember.String.htmlSafe(projectUrl);
  }),

  defaultName: Ember.computed('id','templateBase', function() {
    var name = this.get('id');
    var base = this.get('templateBase');

    name = name.replace(/^[^:\/]+[:\/]/,'');  // Strip the "catalog-name:"
    if ( base )
    {
      var idx = name.indexOf(base);
      if ( idx === 0 )
      {
        name = name.substr(base.length+1); // Strip the "template-base*"
      }
    }

    // Strip anything else invalid
    name = name.replace(/[^a-z0-9-]+/ig,'');

    if ( name === 'k8s' ) {
      name = 'kubernetes';
    }

    return name;
  }),

  machineHasIcon: Ember.computed('templateBase', function(){
    if (this.get('templateBase') === 'machine') {
      if (this.get('links.icon')) {
        return this.get('links.icon');
      }
    }
    return false;
  }),

  supportsOrchestration(orch) {
    orch = orch.replace(/.*\*/,'');
    if ( orch === 'k8s' ) {
      orch = 'kubernetes';
    }
    let list = ((this.get('labels')||{})[C.LABEL.ORCHESTRATION_SUPPORTED]||'').split(/\s*,\s*/).filter((x) => x.length > 0);
    return list.length === 0 || list.includes(orch);
  },

  supported: function() {
    let orch = this.get('projects.current.orchestration')||'cattle';
    if ( (this.get('category')||'').toLowerCase() === 'orchestration' ) {
      return orch === 'cattle';
    } else {
      return this.supportsOrchestration(orch);
    }
  }.property('labels','projects.current.orchestration'),

  certifiedClass: function() {
    let str = null;
    let labels = this.get('labels');
    if ( labels && labels[C.LABEL.CERTIFIED] ) {
      str = labels[C.LABEL.CERTIFIED];
    }

    if ( str === C.LABEL.CERTIFIED_RANCHER && this.get('catalogId') === C.CATALOG.LIBRARY_KEY ) {
      return 'badge-certified';
    } else if ( str === C.LABEL.CERTIFIED_PARTNER ) {
      return 'badge-partner';
    } else {
      return 'badge-thirdparty';
    }
  }.property('catalogId'),

  certified: function() {
    let out = null;
    let labels = this.get('labels');
    if ( labels && labels[C.LABEL.CERTIFIED] ) {
      out = labels[C.LABEL.CERTIFIED];
    }

    let looksLikeCertified = false;
    if ( out ) {
      let display = this.get('intl').t('catalogPage.index.certified.rancher.rancher');
      looksLikeCertified = normalize(out) === normalize(display);
    }

    if ( this.get('catalogId') !== C.CATALOG.LIBRARY_KEY && (out === C.LABEL.CERTIFIED_RANCHER || looksLikeCertified) ) {
      // Rancher-certified things can only be in the library catalog.
      out = null;
    }

    // For the standard labels, use translations
    if ( [C.LABEL.CERTIFIED_RANCHER,C.LABEL.CERTIFIED_PARTNER].includes(out) ) {
      let pl = 'pl';
      if ( this.get('settings.isRancher') ) {
        pl = 'rancher';
      }
      return this.get('intl').t('catalogPage.index.certified.'+pl+'.'+out);
    }

    // For custom strings, use what they said.
    return out;
  }.property('catalogId','labels'),
});

function normalize(str) {
  return (str||'').replace(/[^a-z]/gi,'').toLowerCase();
}

