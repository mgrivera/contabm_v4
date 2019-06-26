

import React from 'react';

// para poder mostrar texto con html correctamente interpretado desde un react component 
function createMarkup(message) {
    return { __html: message };
}

export default function DangerouslySetInnerHtml(props) {
    return <div dangerouslySetInnerHTML={createMarkup(props.message)} />;
}