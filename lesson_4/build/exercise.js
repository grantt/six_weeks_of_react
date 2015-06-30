// Mixins
var FluxMixin = Fluxxor.FluxMixin(React);

// Action constants
var constants = {
    GENERATE_LOREM_IPSUM: 'GENERATE_LOREM_IPSUM',
    GENERATE_LOREM_IPSUM_ERROR: 'GENERATE_LOREM_IPSUM_ERROR',
    GENERATE_LOREM_IPSUM_SUCCESS: 'GENERATE_LOREM_IPSUM_SUCCESS',
    UPDATE_PREVIEW: 'UPDATE_PREVIEW'
};

var actions = {
    generateLoremIpsum: function(currentMarkdownEditor) {
        // we should still dispatch the original action, in case any stores
        // are listening for the first event, that kicks off the API call
        this.dispatch(constants.GENERATE_LOREM_IPSUM, currentMarkdownEditor);

        var that = this;
        $.get('http://baconipsum.com/api/?type=all-meat&paras=2&start-with-lorem=1', function(data, statusText) {
            if (statusText === 'success') {
                that.dispatch(constants.GENERATE_LOREM_IPSUM_SUCCESS, data);
            } else {
                that.dispatch(constants.GENERATE_LOREM_IPSUM_ERROR);
            }
        });
    },
    updatePreview: function(currentMarkdownEditor) {
        this.dispatch(constants.UPDATE_PREVIEW, currentMarkdownEditor);
    }
};

// Stores
var DocumentStore = Fluxxor.createStore({
    mixins: [
        FluxMixin
    ],

    initialize: function() {
        this.document = {
            'text': ''
        };

        this.bindActions(
            constants.GENERATE_LOREM_IPSUM, this.generateLoremIpsum,
            constants.GENERATE_LOREM_IPSUM_SUCCESS, this.generateLoremIpsumSuccess,
            constants.GENERATE_LOREM_IPSUM_ERROR, this.generateLoremIpsumError,
            constants.UPDATE_PREVIEW, this.onUpdatePreview
        );
    },

    generateLoremIpsum:function() {
        console.log('Generating lorem ipsum from the store....');
    },

    generateLoremIpsumError: function() {
        console.error('There was an error generating lorem ipsum...');
    },

    generateLoremIpsumSuccess: function(loremIpsum) {
        this.document.text += loremIpsum;

        this.emit('change');
    },

    onUpdatePreview: function(payload) {
        this.document.text = payload;

        this.emit('change');
    },

    getState: function() {
        return {
            document: this.document
        };
    }
});

// Markdown editor Subcomponent
var MarkdownEditor = React.createClass({
    displayName : 'MarkdownEditor',

    mixins: [
        FluxMixin,
        Fluxxor.StoreWatchMixin('DocumentStore')
    ],

    getStateFromFlux: function() {
        var flux = this.getFlux();
        return flux.store('DocumentStore').getState();
    },

    handleLoremIpsumClick: function() {
        var flux = this.getFlux();
        flux.actions.generateLoremIpsum();
    },

    // we need an onChange handler since React textarea elements
    // with value attributes are considered "controlled", and as such
    // the textarea would not be editable by users. this makes the
    // text area editable for users
    handleOnChange: function(event) {
        var flux = this.getFlux();
        var state = _.extend(this.state.document, {text: event.target.value});
        this.setState(
            {
                document: state
            }
        );
        flux.actions.updatePreview(this.state.document.text);
    },

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("h2", null, "Editor"), 
                React.createElement("textarea", {
                    rows:  this.props.textAreaRows, 
                    cols:  this.props.textAreaCols, 
                    value: this.state.document.text, 
                    onChange: this.handleOnChange}
                ), 
                React.createElement("br", null), 
                React.createElement("button", {
                    onClick: this.handleLoremIpsumClick
                }, "Get Lorem Ipsum!")
            )
        );
    }
});

// Markdown preview Subcomponent
var MarkdownPreview = React.createClass({
    displayName : 'MarkdownPreview',

    mixins: [
        FluxMixin,
        Fluxxor.StoreWatchMixin('DocumentStore')
    ],

    getStateFromFlux: function() {
        var flux = this.getFlux();
        return flux.store('DocumentStore').getState();
    },

    render: function() {
        var div;
        if (this.state.document.text) {
            div = (React.createElement("div", {
                id: "mdPreview", 
                dangerouslySetInnerHTML: {__html: marked(this.state.document.text, {sanitize: true})}}
            ));
        } else {
            div = (React.createElement("div", {
                id: "mdPreview"}
            ));
        }

        return (
            React.createElement("div", null, 
                React.createElement("h2", null, "Preview"), 
            div
            )
        )
    }
});

// Markdown Viewer Component
var MarkdownViewer = React.createClass({
    displayName : 'MarkdownViewer',

    mixins: [
        FluxMixin,
        Fluxxor.StoreWatchMixin('DocumentStore')
    ],

    getStateFromFlux: function() {
        var flux = this.getFlux();
        return flux.store('DocumentStore').getState();
    },

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement(MarkdownEditor, {
                    flux: flux, 
                    textAreaRows: "10", 
                    textAreaCols: "50"}
                ), 
                React.createElement(MarkdownPreview, {
                    flux: flux}
                )
            )
        )
    }
});

// Fluxxor application initialization and main rendering
var stores = {
    DocumentStore: new DocumentStore()
};

// register actions and stores with fluxxor application
// this creates a flux instance
var flux = new Fluxxor.Flux(stores, actions);

React.render(
    React.createElement(MarkdownViewer, {
        flux: flux}
    ),
    document.getElementById('container')
);