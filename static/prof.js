var profDet = [];

var headers = ['Name', 'prog', 'department', 'email', 'password'];

get_dets();
async function get_dets() {
    const token=localStorage.getItem('token');
    const result = await fetch('/api/ProfDetails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token
        })
    }).then((res) => res.json());
    for(var i=0; i<result.details.length; i++) {
        var opt = document.createElement('option');
        profDet[i+1] = {};
        profDet[i+1]['Name'] = result.details[i].Name;
        profDet[i+1]['prog'] = result.details[i].prog;
        profDet[i+1]['department'] = result.details[i].department;
        profDet[i+1]['email'] = result.details[i].email;
        profDet[i+1]['password'] = result.details[i].password;
    }
}
