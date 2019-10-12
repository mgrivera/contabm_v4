

import React, { useState } from "react";
import PropTypes from 'prop-types';

import { Form, FormGroup, FormControl, Button } from 'react-bootstrap';

export default function Search({ handleSearch }) {

    const [search, setSearch] = useState("");

    const handleSubmit = (evt) => {
        evt.preventDefault();
        handleSearch(search);
    }

    return (
        <Form inline onSubmit={handleSubmit}>
            <FormGroup bsSize="small">
                <FormControl type="number" 
                             min="1970" 
                             max="2100" 
                             step="1" 
                             placeholder="año (ej: 2015, blanco: todo)" 
                             value={search} 
                             onChange={e => setSearch(e.target.value)} 
                             style={{ width: "100%" }} />
            </FormGroup>{' '}
            <Button type="submit" bsStyle="primary" bsSize="small">Buscar</Button>
        </Form>
    );
}

Search.propTypes = {
    handleSearch: PropTypes.func.isRequired,
}