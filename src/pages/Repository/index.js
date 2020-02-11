import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import { Loading, Owner, IssueList, Pages } from './styles';
import Container from '../../components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string
      })
    }).isRequired
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filter: 'all',
    page: 1
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filter, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`repos/${repoName}`),
      api.get(`repos/${repoName}/issues?${filter}`, {
        params: {
          state: filter,
          per_page: 5,
          page
        }
      })
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false
    });
  }

  handleSelect = async e => {
    this.setState({
      filter: e.target.value
    });

    this.reloadIssues();
  };

  reloadIssues = async () => {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);
    const { filter, page } = this.state;

    const issues = await api.get(`repos/${repoName}/issues`, {
      params: {
        state: filter,
        per_page: 5,
        page
      }
    });

    this.setState({
      issues: issues.data
    });
  };

  changePage = async action => {
    const { page } = this.state;

    await this.setState({
      page: action === 'back' ? page - 1 : page + 1
    });
    this.reloadIssues();
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          <div>
            <span>Issue State: </span>
            <select onChange={this.handleSelect}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pages>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.changePage('back')}
          >
            Back
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.changePage('next')}>
            Next
          </button>
        </Pages>
      </Container>
    );
  }
}
