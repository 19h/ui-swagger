import React, { useEffect } from "react";
import Markdown from "react-markdown";

import { toHTMLId } from "../../helpers/utils";
import { SampleResponse } from "./SampleResponse";

const Response = ({ response, code }) => {
  let description;
  try {
    description = response.description;
  } catch (error) {
    console.log("ERROR FETCHING DESCRIPTION", error);
  }
  return (
    <tr>
      <td>{code}</td>
      <td>{description || "no description"}</td>
    </tr>
  );
};

const Parameter = ({ parameter, setParameter, values }) => {
  const { name, type, description } = parameter;
  return (
    <div className="">
      <div className="columns">
        <div className="column is-one-quarter">{name}</div>
        <div className="column">
          <input
            className="input"
            type={type}
            value={values[name] || parameter.default || ""}
            onChange={event => setParameter(name, event.target.value)} // TODO save parameter for request
          />
          <p className="parameter__type">{type}</p>
          <Markdown source={description} />
        </div>
      </div>
    </div>
  );
};

const Parameters = ({ parameters, ...props }) => {
  if (!parameters || parameters.length == 0) {
    return "";
  }

  return (
    <div>
      <h5 className="title is-5">Parameters</h5>
      {parameters.map(parameter => (
        <Parameter key={parameter.name} parameter={parameter} {...props} />
      ))}
    </div>
  );
};

const ResponseModal = ({
  isActive = false,
  close,
  requestUrl,
  responseBody,
  responseCode,
  responseHeaders,
  error
}) => {
  if (error) {
    return (
      <div className={`modal ${isActive ? "is-active" : ""}`}>
        <div className="modal-background" onClick={close}></div>
        <div className="modal-card">
          <div className="modal-card-body">
            <h5 className="title is-5">oops, something went wrong...</h5>
            <div>
              <pre>{error.message}</pre>
            </div>
          </div>
        </div>
        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={close}
        ></button>
      </div>
    );
  }
  return (
    <div className={`modal ${isActive ? "is-active" : ""}`}>
      <div className="modal-background" onClick={close}></div>
      <div className="modal-card">
        <section className="modal-card-body">
          <h5 className="title is-5">REQUEST URL</h5>
          <div>
            <pre>{requestUrl}</pre>
          </div>
          <h5 className="title is-5">RESPONSE BODY</h5>
          <div>
            <pre>{responseBody}</pre>
          </div>
          <h5 className="title is-5">RESPONSE CODE</h5>
          <div>
            <pre>{responseCode}</pre>
          </div>
          <h5 className="title is-5">RESPONSE HEADERS</h5>
          <div>
            <pre>{responseHeaders}</pre>
          </div>
        </section>
      </div>
      <button
        className="modal-close is-large"
        aria-label="close"
        onClick={close}
      ></button>
    </div>
  );
};

class Operation extends React.Component {
  state = {
    showTryResponseModal: false,
    parameters: {},
    tryResponseModal: {}
  };

  setParameter = (parameter, value) => {
    this.setState({
      ...this.state,
      parameters: {
        ...this.state.parameters,
        [parameter]: value
      }
    });
  };

  tryOperation = (tag, path, swaggerClient) => {
    swaggerClient.apis[tag][toHTMLId(path)]()
      .then(response => {
        const responseCode = res.statusCode; // status code
        const responseBody = res.body; // JSON object or undefined
        const responseHeaders = res.headers; // header hash

        this.openResponseModal({
          responseBody,
          responseCode,
          responseHeaders
        });
      })
      .catch(error => {
        this.openResponseModal({ error });
      });
  };

  openResponseModal = ({
    requestUrl,
    responseBody,
    responseCode,
    responseHeaders,
    error
  }) => {
    this.setState({
      ...this.state,
      showTryResponseModal: true,
      tryResponseModal: {
        requestUrl,
        responseBody,
        responseCode,
        responseHeaders,
        error
      }
    });
  };

  closeResponseModal = () => {
    this.setState({
      ...this.state,
      showTryResponseModal: false,
      tryResponseModal: {}
    });
  };

  render() {
    const { operation, ...props } = this.props;
    const path = operation.path;
    const method = "get";
    const id = `${method}${path}`;

    const { get } = operation;
    const { summary, description, produces, responses, parameters } = get;

    return (
      <section className="columns operation">
        <div className="column operation__description is-half">
          <h3 id={toHTMLId(id)} className="title is-3">
            {summary}
          </h3>
          <h4 className="title is-4">
            <span className="operation__description__method">{method}</span>
            {path}
          </h4>
          <Markdown source={description} />
          <div>
            <Parameters
              parameters={parameters}
              setParameter={this.setParameter}
              values={this.state.parameters}
            />
          </div>
          <section>
            <h5 className="title is-5">Test this endpoint</h5>
            <button
              className="button is-primary"
              onClick={() =>
                this.tryOperation(props.tag, id, this.props.swaggerClient)
              }
            >
              {" "}
              TRY
            </button>
            <div className="box">
              <div className="field control">
                Response Types
                <select className="select">
                  {produces.map(contentType => (
                    <option
                      key={toHTMLId(`${id}_produce_option_${contentType}`)}
                      value={contentType}
                    >
                      {contentType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <section>
            <h5 className="title is-5">Response Messages</h5>
            <table className="table full-width">
              <tbody>
                {Object.entries(responses).map(([code, response]) => (
                  <Response
                    key={`response_${code}`}
                    response={response}
                    code={code}
                  />
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <section className="column operation__samples is-half">
          <SampleResponse responses={responses} {...props} />
        </section>
        <ResponseModal
          isActive={this.state.showTryResponseModal}
          close={this.closeResponseModal}
          {...this.state.tryResponseModal}
        />
      </section>
    );
  }
}

const Operations = ({ tag, taggedOperations, ...props }) => {
  const operations = Object.values(taggedOperations.operations);
  return (
    <section id={toHTMLId(tag)}>
      <div>
        {operations.map(operation => (
          <Operation
            key={`operation_${toHTMLId(operation.path)}`}
            operation={operation}
            tag={tag}
            {...props}
          />
        ))}
      </div>
    </section>
  );
};

export const TaggedOperations = ({ orderedOperations, ...props }) => {
  return orderedOperations.map(taggedOperations => (
    <Operations
      key={`operations_${toHTMLId(taggedOperations.tag)}`}
      tag={taggedOperations.tag}
      taggedOperations={taggedOperations}
      {...props}
    />
  ));
};
