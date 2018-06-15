import React, { Component } from 'react';
import { Button, Container, Row, Col, Form, FormGroup, Label, Input, Badge, Collapse, Card, CardBody } from 'reactstrap';

export default class UploadToStorage extends Component {
    constructor(props) {
      super(props);
      this.toggle = toggle.bind(this);
      this.state = {
        collapse: false
      }
      this.alerting = this.alerting.bind(this);
      this.requestSponsorship = this.requestSponsorship.bind(this);
    }
  
    alerting() {
      alert("Not yet implemented")
    }
  
    async requestSponsorship() {
      var formData = new FormData();
  
      var fileField = document.querySelector("input[type='file']");
  
      formData.append('ClientAddress',this.props.ethereumAddress);
      formData.append('ChallengeVideo',fileField.files[0]);
      formData.append('ContractABI',"this.props.kuwaId");
      formData.append('ContractAddress',"this.state.password");
      
      let response = await fetch('http://alpha.kuwa.org:3002/KuwaRegistration/', {
       method: 'POST',
       body: formData
      })
      console.log(response);
      return false;
    }
  
    render() {
      return(
        <Container>
          <Row className="row-kuwa-reg">
            <Col>
              <h2>
                <span className="header-kuwa-reg">Submit Your Kuwa ID Request</span>
                <Button color="primary" onClick={this.toggle} outline>
                  <Badge color="primary">?</Badge>
                </Button>
              </h2>
            </Col>
          </Row>
          <Row className="row-kuwa-reg">
            <Col>
              <Collapse isOpen={this.state.collapse}>
                <Card className="elem-kuwa-reg">
                  <CardBody>
                    Some explanation.
                  </CardBody>
                </Card>
              </Collapse>
            </Col>
          </Row>
          <Row className="row-kuwa-reg">
            <Col>
              <strong>Ethereum Address: </strong>{this.props.ethereumAddress}
            </Col>
          </Row>
          <Row className="row-kuwa-reg">
            <Col>
              <strong>Challenge Phrase: </strong>{this.props.challenge === 0 ? "Challenge expired" : this.props.challenge}
            </Col>
          </Row>
          <Row className="row-kuwa-reg">
            <Col>
              <Form>
                <FormGroup>
                  <Label for="videoFile">File</Label>
                  <Input type="file" id="videoFile" />
                </FormGroup>
                <Button color="primary" onClick={this.requestSponsorship}>Upload Info</Button>
              </Form>
            </Col>
          </Row>
        </Container>
      );
    }
  }
  
  var toggle = function() {
    this.setState({ collapse: !this.state.collapse });
  }