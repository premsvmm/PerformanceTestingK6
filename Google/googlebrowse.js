/**
 * Legacy Google Browse Test (Deprecated)
 * 
 * This file is maintained for backward compatibility.
 * For new tests, please use the new framework in /tests/ directory.
 * 
 * Migration guide:
 * - Use tests/google/google-api-test.js instead
 * - Use TEST_PROFILE environment variable instead of STAGE_X_* variables
 * - Use the new BaseTest class for better structure and error handling
 */

import http from "k6/http";
import {check,fail,sleep} from "k6";

// Legacy stage configuration - use TEST_PROFILE in new tests
export let options = {
	stages:[
		{"duration" : __ENV.STAGE_1_DUR, "target": __ENV.STAGE_1_VUS},
		{"duration" : __ENV.STAGE_2_DUR, "target": __ENV.STAGE_2_VUS},
		{"duration" : __ENV.STAGE_3_DUR, "target": __ENV.STAGE_3_VUS},
		{"duration" : __ENV.STAGE_4_DUR, "target": __ENV.STAGE_4_VUS},
		{"duration" : __ENV.STAGE_5_DUR, "target": __ENV.STAGE_5_VUS}
	].filter(stage => stage.duration && stage.target), // Filter out undefined stages
	
	// Add basic thresholds for better monitoring
	thresholds: {
		http_req_duration: ['p(95)<2000'],
		http_req_failed: ['rate<0.1']
	}
}

export default function(){
    loadGoogleWebsite();
    
    // Add small delay to prevent overwhelming the API
    sleep(1);
}

function loadGoogleWebsite(){
	try {
		let resp = http.get("https://api.country.is", {
			timeout: '30s',
			headers: {
				'User-Agent': 'K6-Legacy-Test/1.0'
			}
		});
		
		// Enhanced logging
		if (__ENV.DEBUG === 'true') {
			console.log("Response Status Code: " + resp.status);
			console.log("Response Body: " + resp.body);
		} else {
			console.log(resp.body);
		}
		
		check_and_fail(resp, 200);
		
		// Additional checks for better validation
		check(resp, {
			'response time < 5000ms': (r) => r.timings.duration < 5000,
			'response has body': (r) => r.body && r.body.length > 0
		});
		
	} catch (error) {
		console.error("Request failed: " + error.message);
		fail("Request failed: " + error.message);
	}
}

function check_and_fail(response, expectedStatusCode){
	const result = check(response, {
		[`status code ${expectedStatusCode}`]: (res) => res.status === expectedStatusCode
	});
	
	if (!result) {
		const errorMsg = `Expected ${expectedStatusCode} status but obtained ${response.status}`;
		console.error(errorMsg);
		fail(errorMsg);
	}
}