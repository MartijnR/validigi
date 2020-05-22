/* global process */
/* eslint-env mocha */

const { XForm } = require( '../../src/xform' );
const expect = require( 'chai' ).expect;
const fs = require( 'fs' );
const path = require( 'path' );

const loadXForm = filename => fs.readFileSync( path.join( process.cwd(), 'test/xform', filename ), 'utf-8' );

describe( 'XPath expressions', () => {

    const xf = new XForm( loadXForm( 'model-only.xml' ) );
    xf.parseModel();

    describe( 'with function calls with an insufficient number of parameters', () => {

        it( 'should throw an error message for selected()', () => {
            const expr = 'selected(/data/a)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

        it( 'should throw an error message for floor()', () => {
            const expr = 'floor()';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

    } );

    describe( 'with function calls with an excessive number of parameters', () => {

        it( 'should throw an error message for selected()', () => {
            const expr = 'selected(/data/a, /data/b, 4)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

        it( 'should throw an error message for floor()', () => {
            const expr = 'floor(4, 5)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

    } );

    describe( 'with function calls with a correct number of parameters', () => {

        it( 'should not throw an error message for selected()', () => {
            const expr = 'selected(/data/a, /data/b)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

        it( 'should not throw an error message for floor()', () => {
            const expr = 'floor(4)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

    } );

    describe( 'with function calls to not supported functions', () => {

        it( 'should throw an error message for not-supported-fn()', () => {
            const expr = 'not-supported-fn(/data/a)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

    } );


    xdescribe( 'with expressions that refer to self when not allowed', () => {
        // There is an integration test in xform.spec.js
        const FULL_PATH_TO_SELF = '/data/a';
        [
            '. + 1',
            `${FULL_PATH_TO_SELF} + 1`,
            'string-length(.)',
            `string-length(${FULL_PATH_TO_SELF})`,
            '../a + 1',
            'string-length(../a)',
            '.',
            ' .',
            '../*',
            `weighted-checklist(${FULL_PATH_TO_SELF}, 9, /thedata/somenodes/*, /thedata/someweights/*)`,
            'concat(/thedata/somenodes/*, sum(/data/*))',
            `concat(/thedata/somenodes/*, sum(/data/b)) + 1 *${FULL_PATH_TO_SELF}`,
            `something -${FULL_PATH_TO_SELF} *5`,
        ].forEach( expr => {
            it( `should be detected: ${expr}`, () => {
                expect( xf.hasSelfReference( expr, FULL_PATH_TO_SELF ) ).to.equal( true );
            } );
        } );


        // This utterly fails because of the bad bad _extractNodeReferences function
        [
            '/unhcr-fail-a4fwaePSGR9RnMuA2vMvoz/B/b1_isregistered =&quot;No,_it_is_the_first_PCP_and-or_CSI_initiated_by_this_community&quot; or  /unhcr-fail-a4fwaePSGR9RnMuA2vMvoz/B/b1_isregistered =&quot;Yes,_this_community_is_already_recorded_but_needs_to_be_updated&quot;'
        ].forEach( expr => {
            it( `doesn't throw with: ${expr}`, () => {
                expect( () => xf.hasSelfReference( expr, FULL_PATH_TO_SELF ) ).not.to.throw();
            } );
        } );

    } );

    describe( 'with instance() calls', () => {

        it( 'should throw an error message if instance does not exist in the form', () => {
            const expr = 'instance("not-there")';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );

        it( 'should not throw an error message if internal instance exists in the form', () => {
            const expr = 'instance("existing-internal")/item';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

        it( 'should not throw an error message if external instance exists in the form', () => {
            const expr = 'instance("existing-external")/item';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

    } );

    describe( 'with jr:choice-name() calls', () => {
        it( 'should not throw an error message for simple usage with double quotes', () => {
            const expr = 'jr:choice-name("yes", "/data/a")';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

        it( 'should not throw an error message for simple usage with single quotes', () => {
            const expr = 'jr:choice-name("yes", \'/data/a\')';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

        it( 'should not throw an error message for complex usage', () => {
            // additional logic, with brackets, after jr:choice-name()
            const expr = 'if(string-length(/K/p/i/a) !=0, jr:choice-name(/K/p/i/a,\'/K/p/i/a\'),\'unspecified\')';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );

        it( 'should not throw an error message for very complex usage', () => {
            // nested function inside jr:choice-name()
            const expr = 'if(string-length(/K/p/i/a) !=0, jr:choice-name(concat("a", "b"),\'/K/p/i/a\'),\'unspecified\')';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );
    } );

    // Needs to fail here as we're not in openclinica mode.
    describe( 'with comment-status() calls', () => {
        it( 'should not throw an error message', () => {
            const expr = 'comment-status(/data/a)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).to.throw();
        } );
    } );

} );

describe( 'XPath expressions (in custom OpenClinica evaluator)', () => {

    const xf = new XForm( loadXForm( 'model-only.xml' ), { openclinica: true } );
    xf.parseModel();

    describe( 'with comment-status() calls', () => {
        it( 'should not throw an error message', () => {
            const expr = 'comment-status(/data/a)';
            const evaluationFn = () => xf.enketoEvaluate( expr );
            expect( evaluationFn ).not.to.throw();
        } );
    } );

} );
