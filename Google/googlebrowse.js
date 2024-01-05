import http from "k6/http";
import {check,fail,sleep} from "k6";

export let options = {
	stages:[
		{"duration" : __ENV.STAGE_1_DUR, "target": __ENV.STAGE_1_VUS},
		{"duration" : __ENV.STAGE_2_DUR, "target": __ENV.STAGE_2_VUS},
		{"duration" : __ENV.STAGE_3_DUR, "target": __ENV.STAGE_3_VUS},
		{"duration" : __ENV.STAGE_4_DUR, "target": __ENV.STAGE_4_VUS},
		{"duration" : __ENV.STAGE_5_DUR, "target": __ENV.STAGE_5_VUS}
	]
}

export default function(){
    loadGoogleWebsite();
}

function loadGoogleWebsite(){
        let resp = http.get("https://api.country.is");
        //console.log("Response Status Code "+resp.status);
        console.log(resp.body)
        check_and_fail(resp,200);
    }

function check_and_fail(response,expectedStatusCode){
	check(response,{"status code 200" : (res) => res.status === expectedStatusCode}) || fail("Expected "+expectedStatusCode+" status but obtained "+response.status);
}